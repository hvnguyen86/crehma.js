# CREHMA.js
CREHMA stands for Cache-ware REST-ful HTTP Message Authentication. It is an end-to-end authenticity and integrity scheme for HTTP messages that can be used in conjunction with web caches.  To ensure end-to-end authenticity and integrity, CREHMA builds a signature over the whole HTTP message. Response messages can also be cached and modified by intermediate systems without running into the risk that the signature value is classified as invalid or a replay attack.  To do so, each signed response message  includes a signature freshness. With this value clients can verify whether a response is reused by a legitimate cache.
CREHMA.js is designed to be used in any Javascript-based environemt such as Node, vert.x or in the Webbrowser. 

# How does it works?
CREHMA creates a digital signature over the whole HTTP message by concatenating the security-critical headers and the body to a string. This concatenated string is then signed by a given key. The signature value in conjunction with signature meta data is then included the Signature header. The other endpoint, i.e client or server, verifies the message's authenticity and integrity by validating the signature value in the Signature header with a given key. 

The figure below shows an example message flow which protected by CREHMA. 
<!-- ![CREHMA protected message flow](https://github.com/hvnguyen86/crehma.js/blob/master/images/message_flow_fl.png "CREHMA protected message flow") -->
![CREHMA protected message flow](https://github.com/hvnguyen86/crehma.js/blob/master/images/CREHMA_message_flow_fl.png "CREHMA protected message flow")
<!-- <img src="https://github.com/hvnguyen86/crehma.js/blob/master/images/CREHMA_message_flow_fl.png" alt="Kitten"
	width="50%" />
<img src="https://github.com/hvnguyen86/crehma.js/blob/master/images/CREHMA_message_flow_fl.png" alt="Kitten"
	width="50%" /> -->
The appended Signature header is marked in bold. CREHMA are compatible  with caches. Signed response messages can be stored and reused by caches as shown be the figure. If client received a reused response message from the cache then it needs to verify signature freshness in addition to the signature value. In this example, the signature freshness is calculated from the time stamp of tvp parameter and the max-age value of the Cache-Control header. The seconds in max-age (360) are then added to the tvp value (). 

```
2019-06-13T15:45:10.494Z + 360 <= <current_time>
```

The signature freshness is valid, If the sum is lower then the current time.


Let's assume that the following HTTP request message 

```
GET / HTTP/1.1
Accept: application/json
Host: localhost:3000
```
Then the concatenated string to be signed is built to:
```
2020-03-30T08:58:18.939Z
GET
/
HTTP/1.1
application/json


localhost:3000


47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU
```
After signing this string, the signed HTTP request message has the following shape and will be sent to the origin server.
```
GET / HTTP/1.1
Accept: application/json
Host: localhost:3000
Signature: sig=HMAC/SHA256,hash=SHA256,kid=jCREHMAKey,tvp=2020-03-30T08:58:18.939Z,addHeaders=null,sv=-BISmytcqhowT27-iaE9jUKahCzG95n96z8vsI5MI0E
```

The origin server verifies this request message based on the information included in the Signature header. It  builds a string according to same concatenation order as the client. This string will verified by a corresponding verification key.  
In case the signature is valid, the origin server will generate the following response message:

```
HTTP/1.1 200 OK
Cache-Control: max-age=3600
Content-Length: 38
Content-Type: text/plain
ETag: BOpGqmfVxx

Valid Request Signature 1585558698960

```

The concatenated string to be signed is then build as follows. Note that the 


```
2020-03-30T08:58:18.960Z
GET localhost:3000/
HTTP/1.1
200
max-age=3600
38
text/plain
BOpGqmfVxx




Ogsxz6JAfkmeZ_AcITK-KxDbBgVel9deG9XBH8YMORg
```

After generating the signature value, the origin server appends a Signature header to the returned response message which is sent to the client.

```
HTTP/1.1 200 OK
Cache-Control: max-age=3600
Content-Length: 38
Content-Type: text/plain
ETag: BOpGqmfVxx
Signature: sig=HMAC/SHA256,hash=SHA256,kid=jCREHMAKey,tvp=2020-03-30T08:58:18.960Z,addHeaders=null,sv=HHeADsjjh_LGG0VLbrbyQ5Gu4-UKnkGa9rkkib4uCHE

Valid Request Signature 1585558698960

```

Based on the Signature header, the client validates the request message's authenticity and integrity. 

